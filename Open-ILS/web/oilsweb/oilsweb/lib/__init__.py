from oilsweb.lib.context import Context, SubContext, ContextItem
import osrf.ses, oils.utils.csedit, pylons.config, oils.utils.utils, oils.event
from gettext import gettext as _

class AuthException(Exception):
    def __init__(self, info=''):
        self.info = info
    def __str__(self):
        return "%s: %s" % (self.__class__.__name__, unicode(self.info))
        
    

class CoreContext(SubContext):

    # cache the authenticated user info
    _auth_cache = {}

    def __init__(self):
        self.prefix = ContextItem() # web prefix
        self.media_prefix = ContextItem() # media prefix
        self.ac_prefix = ContextItem() # added content prefix
        self.skin = ContextItem() # web skin
        self.theme = ContextItem() # web theme
        self.authtoken = ContextItem(cgi_name='ses', session=True) # authtoken string
        self.user = ContextItem() # logged in user object
        self.workstation = ContextItem() # workstation object
        self.page = ContextItem() # the current page
        self.use_demo = ContextItem(cgi_name='demo') # use the demo login

    def postinit(self):
        self.prefix = pylons.config['oils_prefix']
        self.media_prefix = pylons.config['oils_media_prefix']
        self.ac_prefix = pylons.config['oils_added_content_prefix']

        self.skin = 'default' # XXX
        self.theme = 'default' # XXX

        self.fetchUser()

    def doLogin(self):
        if pylons.config.get('oils_demo_user'):
            evt = oils.utils.utils.login(
                pylons.config['oils_demo_user'],
                pylons.config['oils_demo_password'],
                'staff',
                pylons.config['oils_demo_workstation'])
            oils.event.Event.parse_and_raise(evt)
            self.authtoken = evt['payload']['authtoken']

    def fetchUser(self):
        ''' Grab the logged in user and their workstation '''

        if not self.authtoken:
            self.doLogin()

        if self.authtoken:

            if self.authtoken in CoreContext._auth_cache:
                self.user = CoreContext._auth_cache[self.authtoken]['user']
                self.workstation = CoreContext._auth_cache[self.authtoken]['workstation']
                return

            self.user = osrf.ses.ClientSession.atomic_request(
                'open-ils.auth', 
                'open-ils.auth.session.retrieve', self.authtoken)

            if not self.user:
                raise AuthException(_('No user found with authtoken %(self.authtoken)s'))
            self.workstation = oils.utils.csedit.CSEditor().retrieve_actor_workstation(self.user.wsid())

            if not self.workstation:
                raise AuthException(_('No workstation found'))

            # cache the auth data and destroy any old auth data
            CoreContext._auth_cache = {
                self.authtoken : {
                    'user' : self.user, 
                    'workstation' : self.workstation
                }
            }
        else:
            raise AuthException(_('No authentication token provided'))
        
Context.applySubContext('core', CoreContext)


class UtilContext(SubContext):
    ''' The UtilContext maintains a set of general use functions '''
    def __init__(self):
        import oilsweb.lib.bib
        self.scrub_isbn = ContextItem(default_value=oilsweb.lib.bib.scrub_isbn)

Context.applySubContext('util', UtilContext)


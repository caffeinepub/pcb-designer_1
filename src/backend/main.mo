import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type Rotation = Int;
  public type Position = {
    x : Float;
    y : Float;
  };

  public type Component = {
    id : Nat;
    name : Text;
    position : Position;
    rotation : Rotation;
  };

  public type UserProfile = {
    name : Text;
  };

  public type PCBDesign = {
    name : Text;
    components : [Component];
    createdAt : Int;
    updatedAt : Int;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let boardstore = Map.empty<Text, PCBDesign>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get own profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view profile for oneself");
    };
    userProfiles.get(user);
  };

  func makeKey(caller : Principal, designName : Text) : Text {
    caller.toText() # ":" # designName;
  };

  public shared ({ caller }) func saveDesign(design : PCBDesign) : async () {
    let key = makeKey(caller, design.name);
    let updatedDesign = {
      design with
      updatedAt = 0;
    };
    boardstore.add(key, updatedDesign);
  };

  public query ({ caller }) func loadDesign(name : Text) : async PCBDesign {
    let key = makeKey(caller, name);
    switch (boardstore.get(key)) {
      case (?design) { design };
      case (null) { Runtime.trap("Design not found") };
    };
  };

  public query ({ caller }) func listDesigns() : async [Text] {
    var result : [Text] = [];
    let prefix = caller.toText() # ":";
    let mapsToArray = boardstore.toArray();
    for ((key, design) in mapsToArray.values()) {
      if (key.startsWith(#text(prefix))) {
        result := result.concat([design.name]);
      };
    };
    result;
  };

  public shared ({ caller }) func deleteDesign(name : Text) : async () {
    let key = makeKey(caller, name);
    if (not boardstore.containsKey(key)) {
      Runtime.trap("Design does not exist");
    };
    boardstore.remove(key);
  };

  public query ({ caller }) func getBoardstoreKeys() : async [Text] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) { Runtime.trap("Unauthorized: Only admins can view all board keys") };
    let entries = boardstore.toArray();
    entries.map(func(tuple) { tuple.0 });
  };
};
